import { BaseConnection } from './BaseConnection';
import type { MeshtasticDevice } from '../types';

type BluetoothOptions = {
  filters?: BluetoothRequestDeviceFilter[];
};

export class BluetoothConnection extends BaseConnection<BluetoothOptions> {
  private device?: BluetoothDevice;
  private rxCharacteristic?: BluetoothRemoteGATTCharacteristic;
  private txCharacteristic?: BluetoothRemoteGATTCharacteristic;

  async connect(options?: BluetoothOptions): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth not supported');
    }

    this.device = await navigator.bluetooth.requestDevice({
      filters: options?.filters ?? [{ services: ['generic_access', 'generic_attribute'] }],
      optionalServices: ['generic_access', 'generic_attribute']
    });

    this.device.addEventListener('gattserverdisconnected', () => this.emit('disconnect'));

    const server = await this.device.gatt?.connect();
    if (!server) throw new Error('Unable to connect to GATT server');

    const accessService = await server.getPrimaryService('generic_access');
    this.rxCharacteristic = await accessService.getCharacteristic('gap.device_name');
    const buffer = await this.rxCharacteristic.readValue();
    const decoder = new TextDecoder();
    const displayName = decoder.decode(buffer);

    const device: MeshtasticDevice = {
      id: this.device.id,
      transport: 'bluetooth',
      displayName: displayName || this.device.name || 'Meshtastic BT'
    };

    this.emit('connect', device);

    await this.rxCharacteristic.startNotifications();
    this.rxCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;
      const array = new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
      this.emit('message', array);
    });

    try {
      const attributeService = await server.getPrimaryService('generic_attribute');
      this.txCharacteristic = await attributeService.getCharacteristic('gatt.service_changed');
    } catch (error) {
      console.warn('TX characteristic unavailable', error);
    }
  }

  async send(bytes: Uint8Array): Promise<void> {
    if (!this.txCharacteristic) throw new Error('Characteristic unavailable');
    await this.txCharacteristic.writeValue(bytes);
  }

  async disconnect(): Promise<void> {
    await this.device?.gatt?.disconnect();
    this.emit('disconnect');
  }
}
